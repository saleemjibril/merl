"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import StatusBadge from "./StatusBadge";
import Modal from "./Modal";

const LEVELS = ["goal", "outcome", "output", "activity"];

function TreeBranch({
  nodes,
  depth,
  canEdit,
  parentId,
  collapsedMap,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onAddIndicator,
  onReorderChildren,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const ids = useMemo(() => nodes.map((n) => n._id), [nodes]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = nodes.findIndex((n) => n._id === active.id);
        const newIndex = nodes.findIndex((n) => n._id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        onReorderChildren(parentId, arrayMove(nodes, oldIndex, newIndex));
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={depth === 0 ? "tree-root" : "tree-children"}>
          {nodes.map((node) => (
            <SortableNodeInner
              key={node._id}
              node={node}
              depth={depth}
              canEdit={canEdit}
              collapsedMap={collapsedMap}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddIndicator={onAddIndicator}
              onReorderChildren={onReorderChildren}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableNodeInner({
  node,
  depth,
  canEdit,
  collapsedMap,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onAddIndicator,
  onReorderChildren,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node._id, disabled: !canEdit });
  const collapsed = !!collapsedMap[node._id];
  const hasChildren = node.children?.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className="tree-node"
    >
      <div className={`tree-node__head tree-node__head--${node.level}`}>
        <div className="tree-node__main">
          <div className="tree-node__controls">
            {canEdit ? (
              <button
                type="button"
                className="tree-drag"
                aria-label="Drag to reorder"
                {...attributes}
                {...listeners}
              >
                ⋮⋮
              </button>
            ) : null}
            {hasChildren ? (
              <button
                type="button"
                className="tree-collapse"
                onClick={() => onToggle(node._id)}
              >
                {collapsed ? "▸" : "▾"}
              </button>
            ) : (
              <span className="tree-collapse tree-collapse--spacer" />
            )}
            <span className="level-pill">{node.level}</span>
          </div>
          <h4>{node.title}</h4>
          {node.description ? <p className="muted tree-node__desc">{node.description}</p> : null}
          {node.indicators?.length > 0 && (
            <ul className="tree-node__indicators">
              {node.indicators.map((ind) => (
                <li key={ind._id}>
                  <strong>{ind.name}</strong>
                  <span className="muted"> · {ind.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {canEdit && (
          <div className="tree-node__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEdit(node)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onAddIndicator(node)}
            >
              + Indicator
            </button>
            {node.level !== "activity" && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onAddChild(node)}
              >
                + Child
              </button>
            )}
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => onDelete(node)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      {!collapsed && hasChildren ? (
        <TreeBranch
          nodes={node.children}
          depth={depth + 1}
          canEdit={canEdit}
          parentId={node._id}
          collapsedMap={collapsedMap}
          onToggle={onToggle}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddIndicator={onAddIndicator}
          onReorderChildren={onReorderChildren}
        />
      ) : null}
    </div>
  );
}

export default function LogframeTree({
  tree,
  unassignedIndicators = [],
  canEdit,
  onAddRoot,
  onAddChild,
  onEdit,
  onDelete,
  onAddIndicator,
  onReorder,
}) {
  const [collapsedMap, setCollapsedMap] = useState({});
  const [localTree, setLocalTree] = useState(tree);

  useEffect(() => {
    setLocalTree(tree);
  }, [tree]);

  function onToggle(id) {
    setCollapsedMap((m) => ({ ...m, [id]: !m[id] }));
  }

  function replaceChildren(nodes, parentId, nextChildren) {
    if (parentId == null) return nextChildren;
    return nodes.map((n) => {
      if (n._id === parentId) return { ...n, children: nextChildren };
      if (n.children?.length) {
        return {
          ...n,
          children: replaceChildren(n.children, parentId, nextChildren),
        };
      }
      return n;
    });
  }

  function handleReorder(parentId, nextSiblings) {
    setLocalTree((prev) => replaceChildren(prev, parentId, nextSiblings));
    const items = nextSiblings.map((n, i) => ({
      id: n._id,
      sortOrder: i,
      parent: parentId,
    }));
    onReorder?.(items);
  }

  return (
    <div className="stack">
      {canEdit && (
        <div className="row">
          <button type="button" className="btn btn--sm" onClick={onAddRoot}>
            Add goal / root node
          </button>
          <span className="muted">Drag ⋮⋮ to reorder · Levels: {LEVELS.join(" → ")}</span>
        </div>
      )}

      {localTree.length === 0 ? (
        <div className="empty">No logframe nodes yet. Add a goal to start the tree.</div>
      ) : (
        <TreeBranch
          nodes={localTree}
          depth={0}
          canEdit={canEdit}
          parentId={null}
          collapsedMap={collapsedMap}
          onToggle={onToggle}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddIndicator={onAddIndicator}
          onReorderChildren={handleReorder}
        />
      )}

      {unassignedIndicators.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16 }}>Unassigned indicators</h3>
          <ul>
            {unassignedIndicators.map((ind) => (
              <li key={ind._id}>
                {ind.name} <StatusBadge status={ind.unit} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function NodeFormModal({
  open,
  title,
  initial,
  parentOptions = [],
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(
    initial || { title: "", description: "", level: "goal", parent: "", sortOrder: 0 }
  );

  useEffect(() => {
    if (open) {
      setForm(
        initial || { title: "", description: "", level: "goal", parent: "", sortOrder: 0 }
      );
    }
  }, [open, initial]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...form,
            parent: form.parent || null,
            sortOrder: Number(form.sortOrder) || 0,
          });
        }}
      >
        <div className="field">
          <label>Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Level</label>
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Parent</label>
          <select
            value={form.parent || ""}
            onChange={(e) => setForm({ ...form, parent: e.target.value })}
          >
            <option value="">None (root)</option>
            {parentOptions.map((p) => (
              <option key={p._id} value={p._id}>
                {p.level}: {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            rows={3}
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="row">
          <button type="submit" className="btn">
            Save
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

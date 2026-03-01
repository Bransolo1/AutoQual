export function resolveDependencyOrder(tasks: { id: string; dependencies: string[] }[]) {
  const graph = new Map<string, string[]>();
  tasks.forEach((task) => graph.set(task.id, task.dependencies));

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];

  const visit = (id: string) => {
    if (visiting.has(id)) {
      throw new Error("Dependency cycle detected");
    }
    if (visited.has(id)) {
      return;
    }
    visiting.add(id);
    const deps = graph.get(id) ?? [];
    deps.forEach((dep) => visit(dep));
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };

  tasks.forEach((task) => visit(task.id));
  return order;
}

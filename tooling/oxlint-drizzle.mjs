// Keep the project's DELETE/UPDATE safety policy independent of TypeScript's
// JavaScript API. The upstream plugin imports an undeclared typescript-eslint
// dependency, so loading it would reintroduce the compatibility problem.
function propertyName(member) {
  if (member.property.type === 'Identifier' && !member.computed) return member.property.name;
  if (member.property.type === 'Literal') return member.property.value;
}

function hasWhere(call) {
  let current = call;
  while (current.parent?.type === 'MemberExpression' && current.parent.object === current) {
    const member = current.parent;
    const next = member.parent;
    if (next?.type !== 'CallExpression' || next.callee !== member) break;
    if (propertyName(member) === 'where') return true;
    current = next;
  }
  return false;
}

function mutationRule(method) {
  return {
    meta: {
      type: 'problem',
      schema: [],
      messages: {
        missingWhere: `Drizzle ${method.toUpperCase()} must include .where(...) to avoid changing every row.`,
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.type !== 'MemberExpression') return;
          const member = node.callee;
          const matches =
            method === 'delete'
              ? propertyName(member) === 'delete'
              : propertyName(member) === 'set' &&
                member.object.type === 'CallExpression' &&
                member.object.callee.type === 'MemberExpression' &&
                propertyName(member.object.callee) === 'update';
          if (matches && !hasWhere(node)) {
            context.report({ node: node.callee, messageId: 'missingWhere' });
          }
        },
      };
    },
  };
}

export default {
  meta: { name: 'drizzle' },
  rules: {
    'enforce-delete-with-where': mutationRule('delete'),
    'enforce-update-with-where': mutationRule('update'),
  },
};

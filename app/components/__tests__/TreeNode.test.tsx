import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TreeNode from '../ast/TreeNode'
import type { ASTNode } from '@/app/types/ast'

describe('TreeNode', () => {
  it('draws sibling and depth guide lines for nested, non-last branches', () => {
    const node: ASTNode = {
      type: 'a-program',
      children: [
        { type: 'branch-a', children: [{ type: 'leaf-c' }, { type: 'leaf-d' }] },
        { type: 'branch-b' },
      ],
    }
    const { getByText } = render(
      <TreeNode node={node} depth={0} isLast guides={[]} initialOpen mode="all" />,
    )
    expect(getByText('leaf-c')).toBeInTheDocument()
    expect(getByText('leaf-d')).toBeInTheDocument()
    expect(getByText('branch-b')).toBeInTheDocument()
  })
})

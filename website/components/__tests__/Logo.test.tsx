import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Logo } from '../Logo'

describe('Logo', () => {
  it('renders logo with name', () => {
    render(<Logo domain="example.com" name="Test" />)
    expect(screen.getByText('Test')).toBeDefined()
  })

  it('uses CDN for known domains', () => {
    const { container } = render(<Logo domain="langchain.com" name="LangChain" />)
    const img = container.querySelector('img')
    expect(img?.src).toContain('simpleicons.org')
  })

  it('uses clearbit for unknown domains', () => {
    const { container } = render(<Logo domain="unknown.com" name="Unknown" />)
    const img = container.querySelector('img')
    expect(img?.src).toContain('clearbit.com')
  })
})

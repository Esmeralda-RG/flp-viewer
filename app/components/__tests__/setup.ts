import '@testing-library/jest-dom'

// jsdom doesn't implement scrollIntoView
globalThis.HTMLElement.prototype.scrollIntoView = () => {}

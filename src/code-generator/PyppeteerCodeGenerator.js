import pptrActions from './pptr-actions'
import Block from './Block'
import CodeGenerator from './CodeGenerator'

const importStatements = `import asyncio\nfrom pyppeteer import launch\n\n`

const header = `browser = await launch()
page = await browser.newPage()`

const footer = `await browser.close()`

const wrappedHeader = `async def main():
  browser = await launch()
  page = await browser.newPage()\n`

const wrappedFooter = `  await browser.close()`

export default class PyppeteerCodeGenerator extends CodeGenerator {
  constructor (options) {
    super(options)
    this._header = header
    this._wrappedHeader = wrappedHeader
    this._footer = footer
    this._wrappedFooter = wrappedFooter
  }

  generate (events) {
    return importStatements + this._getHeader() + this._parseEvents(events) + this._getFooter()
  }

  _handleViewport (width, height) {
    return new Block(this._frameId, { type: pptrActions.VIEWPORT, value: `await ${this._frame}.setViewport({ 'width': ${width}, 'height': ${height} })` })
  }
}

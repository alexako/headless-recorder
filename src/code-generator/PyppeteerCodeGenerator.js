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

const wrappedFooter = `  await browser.close()\n\n
if __name__ == '__main__':    
    asyncio.get_event_loop().run_until_complete(main())`

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

  _parseEvents (events) {
    console.debug(`generating code for ${events ? events.length : 0} events`)
    let result = ''

    if (!events) return result

    for (let i = 0; i < events.length; i++) {
      const { action, selector, value, href, keyCode, tagName, frameId, frameUrl } = events[i]

      // we need to keep a handle on what frames events originate from
      this._setFrames(frameId, frameUrl)

      switch (action) {
        case 'keydown':
          if (keyCode === 9) { // tab key
            this._blocks.push(this._handleKeyDown(selector, value, keyCode))
          }
          break
        case 'click':
          this._blocks.push(this._handleClick(selector, events))
          break
        case 'change':
          if (tagName === 'SELECT') {
            this._blocks.push(this._handleChange(selector, value))
          }
          break
        case pptrActions.GOTO:
          this._blocks.push(this._handleGoto(href, frameId))
          break
        case pptrActions.VIEWPORT:
          this._blocks.push((this._handleViewport(value.width, value.height)))
          break
        case pptrActions.NAVIGATION:
          this._blocks.push(this._handleWaitForNavigation())
          this._hasNavigation = true
          break
        case pptrActions.SCREENSHOT:
          this._blocks.push(this._handleScreenshot(value))
          break
      }
    }

    if (this._hasNavigation && this._options.waitForNavigation) {
      console.debug('Adding navigationPromise declaration')
      const block = new Block(this._frameId, { type: pptrActions.NAVIGATION_PROMISE, value: 'navigationPromise = page.waitForNavigation()' })
      this._blocks.unshift(block)
    }

    console.debug('post processing blocks:', this._blocks)
    this._postProcess()

    const indent = this._options.wrapAsync ? '    ' : ''
    const newLine = `\n`

    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += indent + line.value + newLine
      }
    }

    return result
  }

  /**
   *  TODO: Inherit and modify the following methods:
   *   _postProcessSetFrames()
   * 
   */

}

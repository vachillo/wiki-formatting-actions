import {existsSync} from "fs"
import {extname} from "path"
import transformLinks from "transform-markdown-links"
import { debug } from "@actions/core"

class LinkReplacer {

  private readonly filesPath: string
  private readonly removeSubdirectories: boolean

  constructor(filesPath: string, removeSubdirectories: boolean) {
    this.filesPath = filesPath
    this.removeSubdirectories = removeSubdirectories
  }

  protected safeDecodeURIComponent(str: string): string {
    try {
      return decodeURIComponent(str)
    } catch (e) {
      return str
    }
  }

  transformMarkdownLinks(oldContent: string): string {
    return transformLinks(
        oldContent,
        (link: string) => this.processLink(link)
    )
  }

  protected extractLinkParts(link: string): string[] {
    if (!link.includes('#')) {
      return [link, ""]
    }

    return link.split("#", 2)
  }

  processLink(link: string): string {
    const [potentialEncodedFile, fragment] = this.extractLinkParts(link)
    let potentialFile = this.safeDecodeURIComponent(potentialEncodedFile)
    const fullPath: string = this.filesPath + '/' + potentialFile

    if (!existsSync(fullPath)) {
      debug('File not found: ' + fullPath)
      return link
    }

    if (extname(fullPath) !== '.md') {
      debug('Not a markdown file: ' + fullPath)
      return link
    }

    if (this.removeSubdirectories) {
      debug('Removing subdirectories: ' + potentialFile)
      potentialFile = potentialFile.split('/').pop() as string
    }

    
    const uriPath = encodeURIComponent(potentialFile.substring(0, potentialFile.length - 3))
    debug('Replacing link: ' + link + ' with ' + uriPath)
    if(!fragment){
      return uriPath
    }
    return uriPath + "#"+ encodeURIComponent(fragment)
  }

}

export default LinkReplacer

import readDirSync from 'recursive-readdir-sync'
import {readFileSync, writeFileSync} from 'fs'
import {getInput, info, error, setFailed} from '@actions/core'
import LinkReplacer from './helpers/link-replacer'

export function run(): void {
  const filesPath: string = getInput('path', {required: true})
  const removeSubdirectories: boolean =
    getInput('removeSubdirectories') === 'true'
  const failOnDuplicateNames: boolean =
    getInput('failOnDuplicateNames') === 'true'
  info('Processing files in ' + filesPath)
  info('Remove subdirectories: ' + removeSubdirectories)
  info('Fail on duplicate names: ' + failOnDuplicateNames)

  const replacer = new LinkReplacer(filesPath, removeSubdirectories)

  const fileNames: {[key: string]: string} = {}

  for (const file of readDirSync(filesPath)) {
    const filename: string = file.toString()
    // get just the file name and put it in the fileNames object
    const name = filename.split('/').pop() ?? ''
    // map the file name to the full path
    if (fileNames[name]) {
      info(
        'Duplicate file name: ' +
          name +
          ' at ' +
          filename +
          ' and ' +
          fileNames[name]
      )
      if (failOnDuplicateNames) {
        error(
          'Duplicate file name: ' +
            name +
            ' at ' +
            filename +
            ' and ' +
            fileNames[name]
        )
        setFailed(
          'Duplicate file name: ' +
            name +
            ' at ' +
            filename +
            ' and ' +
            fileNames[name]
        )
        return
      }
    }
    fileNames[name] = filename
  }

  for (const file of readDirSync(filesPath)) {
    const filename: string = file.toString()
    const oldContent: string = readFileSync(filename, 'utf8')
    const newContent: string = replacer.transformMarkdownLinks(oldContent)

    if (oldContent != newContent) {
      info(filename + ' updated')
      writeFileSync(filename, newContent)
    }
  }
}

run()

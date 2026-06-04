export type { FileEntry, FileBackend } from './types'
export {
  listLocalDir,
  readLocalFile,
  writeLocalFile,
  deleteLocalPath,
  mkdirLocal,
  renameLocal
} from './local-fs'
export {
  listMobileDir,
  readMobileFile,
  writeMobileFile,
  deleteMobilePath,
  mkdirMobile
} from './remote-fs'
export { resolvePackageDataRoot } from './mobile-data-path'

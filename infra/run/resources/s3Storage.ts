export const exportsBucket = new sst.aws.Bucket('ExportsBucket', {})
export const snapshotImportsBucket = new sst.aws.Bucket(
  'SnapshotImportsBucket',
  {},
)
export const modulesBucket = new sst.aws.Bucket('ModulesBucket', {})
export const filesBucket = new sst.aws.Bucket('FilesBucket', {})
export const searchBucket = new sst.aws.Bucket('SearchBucket', {})

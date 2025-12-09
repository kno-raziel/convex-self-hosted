import {
  exportsBucket,
  filesBucket,
  modulesBucket,
  searchBucket,
  snapshotImportsBucket,
} from './s3Storage'

const convexUser = new aws.iam.User('ConvexUser')
const convexUserPolicy = new aws.iam.UserPolicy('ConvexUserPolicy', {
  user: convexUser.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'ExportsBucketAccess',
        Effect: 'Allow',
        Action: ['s3:*'],
        Resource: [exportsBucket.arn, $interpolate`${exportsBucket.arn}/*`],
      },
      {
        Sid: 'SnapshotImportsBucketAccess',
        Effect: 'Allow',
        Action: ['s3:*'],
        Resource: [
          snapshotImportsBucket.arn,
          $interpolate`${snapshotImportsBucket.arn}/*`,
        ],
      },
      {
        Sid: 'ModulesBucketAccess',
        Effect: 'Allow',
        Action: ['s3:*'],
        Resource: [modulesBucket.arn, $interpolate`${modulesBucket.arn}/*`],
      },
      {
        Sid: 'FilesBucketAccess',
        Effect: 'Allow',
        Action: ['s3:*'],
        Resource: [filesBucket.arn, $interpolate`${filesBucket.arn}/*`],
      },
      {
        Sid: 'SearchBucketAccess',
        Effect: 'Allow',
        Action: ['s3:*'],
        Resource: [searchBucket.arn, $interpolate`${searchBucket.arn}/*`],
      },
    ],
  },
})
export const convexUserAccessKey = new aws.iam.AccessKey(
  'ConvexUserAccessKey',
  {
    user: convexUser.name,
  },
)

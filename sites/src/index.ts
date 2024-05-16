import { resolve } from 'path'

import {
  CreateNodes,
  CreateNodesContext,
  readJsonFile
} from '@nx/devkit'

export const createNodes: CreateNodes = [
  '**/site-projects/site.*.json',
  (projectConfigurationFile: string, options, context: CreateNodesContext) => {
    const projectConfiguration = readJsonFile(resolve(context.workspaceRoot, projectConfigurationFile)) as {
      name: string
      domain: string
      vercel: {
        projectId: string
        envVars: object
      }
    }

    const cmsProject = `sites-cms-${projectConfiguration.name}`
    const webProject = `sites-web-${projectConfiguration.name}`

    return {
      projects: {
        [cmsProject]: {
          name: cmsProject,
          type: 'app',
          targets: {
            build: {
              cache: false,
              executor: '@nx-extend/strapi:build',
              outputs: [
                '{options.outputPath}'
              ],
              inputs: [
                {
                  'fileset': '{workspaceRoot}/libs/cms/**'
                }
              ],
              options: {
                root: 'libs/sites/strapi',
                outputPath: `dist/sites/cms/${projectConfiguration.name}`,
                tsConfig: 'libs/sites/strapi/tsconfig.json',
                envVars: {}
              },
              configurations: {
                production: {
                  production: true,
                  envVars: {
                    URL: `https://cms.${projectConfiguration.domain}`
                  }
                }
              }
            }
          },
          tags: [
            'project=sites',
            'service=cms',
            'resource=gcp-cloud-run'
          ]
        },
        [webProject]: {
          name: webProject,
          type: 'app',
          targets: {
            build: {
              executor: 'nx:run-commands',
              options: {
                commands: [
                  `echo "build"`
                ],
                parallel: false
              }
            }
          },
          tags: [
            'project=sites',
            'service=web',
            'resource=vercel'
          ]
        }
      }
    }
  }
]

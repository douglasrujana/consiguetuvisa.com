21:25:40.05  🚫  GET  ---  consiguetuvisa-com.vercel.app  ƒ  /dashboard
-----------------------------------------------------------------------
02:25:40 [ERROR] file:///var/task/dist/server/chunks/prisma-singleton_CgKRYJSy.mjs:1
import { PrismaClient } from "@prisma/client";
         ^^^^^^^^^^^^
SyntaxError: Named export 'PrismaClient' not found. The requested module '@prisma/client' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:228:21)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async ModuleJob.run (node:internal/modules/esm/module_job:337:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
    at async AppPipeline.getModuleForRoute (file:///var/task/dist/server/chunks/_@astrojs-ssr-adapter_DDArMBvA.mjs:595:16)
    at async NodeApp.render (file:///var/task/dist/server/chunks/_@astrojs-ssr-adapter_DDArMBvA.mjs:944:19)
    at async Object.handler (file:///var/task/dist/server/chunks/_@astrojs-ssr-adapter_DDArMBvA.mjs:4107:25)
    at async Server.r (/opt/rust/nodejs.js:2:15570)
    at async Server.<anonymous> (/opt/rust/nodejs.js:17:9369)

WARN! Exceeded query duration limit of 5 minutes

PS C:\MyCode\javascript\consiguetuvisa.com>
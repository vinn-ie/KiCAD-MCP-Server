/**
 * Tool registration helper for KiCAD MCP Server
 *
 * Decides whether a tool should be registered directly with the MCP server
 * (always visible to the LLM) or only as a handler accessible via execute_tool
 * (hidden from the initial tool list to reduce token overhead).
 *
 * Direct tools  → server.tool()         → visible in LLM tool list
 * Routed tools  → registerToolHandler() → accessible only via execute_tool
 *
 * The overloaded function signatures mirror McpServer.tool() so TypeScript
 * can infer handler parameter types from Zod schemas at every call site.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, ZodRawShape } from 'zod';
import { isDirectTool } from './registry.js';
import { registerToolHandler } from './router.js';

// 3-arg form: name, schema, handler (no description string)
export function registerTool<T extends ZodRawShape>(
  server: McpServer,
  name: string,
  schema: T,
  handler: (args: z.objectOutputType<T, z.ZodTypeAny>) => Promise<any>
): void;

// 4-arg form: name, description, schema, handler
export function registerTool<T extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  schema: T,
  handler: (args: z.objectOutputType<T, z.ZodTypeAny>) => Promise<any>
): void;

// Implementation – uses (server as any) to satisfy both overloads at runtime
export function registerTool(
  server: McpServer,
  name: string,
  descOrSchema: any,
  schemaOrHandler: any,
  handlerArg?: any
): void {
  const isDirect = isDirectTool(name);

  if (typeof handlerArg === 'function') {
    // 4-arg form: name, description, schema, handler
    if (isDirect) {
      (server as any).tool(name, descOrSchema, schemaOrHandler, handlerArg);
    } else {
      registerToolHandler(name, handlerArg);
    }
  } else {
    // 3-arg form: name, schema, handler
    if (isDirect) {
      (server as any).tool(name, descOrSchema, schemaOrHandler);
    } else {
      registerToolHandler(name, schemaOrHandler);
    }
  }
}

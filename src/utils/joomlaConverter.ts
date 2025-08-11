// utils/joomlaConverter.ts — add an export tail with YOOtheme/YOOessentials meta + bindings
// Drop this into your ' @/utils/joomlaConverter.ts' and ensure convertWebsiteToJoomla
// returns the object from `appendExportMetaTail(...)`.

// ---- types ----
export type AnyRec = Record<string, any>;

interface ExportTail {
  // Mirrors the metadata you showed
  version: string;
  yooessentialsVersion?: string;
  modified: string; // ISO date
  name: string; // library display name
  props: any[]; // usually []
  // Optional dynamic source + prop bindings (if discovered)
  source?: {
    query?: {
      name: string;
      arguments: { offset: number; limit: number; cache: number };
    };
    props?: Record<string, { name: string; filters?: { search: string } }>;
  }
}

// Walk YOOtheme builder tree and pick up source.query + source.props bindings
function extractBindingsFromBuilder(builderConfig: AnyRec | undefined) {
  const out: { lastQueryName?: string; props: Record<string, { name: string; filters?: { search: string } }> } = { props: {} };

  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;

    // capture query name if present
    if (node.source?.query?.name && typeof node.source.query.name === 'string') {
      out.lastQueryName = node.source.query.name;
    }

    // capture bound props (e.g., title, text_2, etc.)
    if (node.source?.props && typeof node.source.props === 'object') {
      for (const [propKey, val] of Object.entries(node.source.props)) {
        if (val && typeof val === 'object' && 'name' in (val as AnyRec)) {
          const v = val as AnyRec;
          out.props[propKey] = {
            name: String(v.name),
            // Normalize filters.search to empty string if missing
            ...(v.filters ? { filters: { search: String(v.filters.search ?? '') } } : { filters: { search: '' } })
          };
        }
      }
    }

    // Recurse into common children shapes
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else {
      if (Array.isArray(node.children)) node.children.forEach(visit);
      if (node.props && typeof node.props === 'object') visit(node.props);
      if (node.content && typeof node.content === 'object') visit(node.content);
      if (node.items && Array.isArray(node.items)) node.items.forEach(visit);
      // Also scan any nested source blocks
      if (node.source && typeof node.source === 'object') visit(node.source);
    }
  };

  if (builderConfig) visit(builderConfig);
  return out;
}

function toLibraryName(fromUrl?: string, fallbacks?: { title?: string }): string {
  if (fallbacks?.title && fallbacks.title.trim()) return fallbacks.title.trim();
  if (!fromUrl) return 'Converted Layout';
  try {
    const u = new URL(fromUrl);
    const path = u.pathname.replace(///$/, '');
    return (path ? `${u.hostname}${path}` : u.hostname).slice(0, 80);
  } catch {
    return fromUrl.slice(0, 80);
  }
}

export function appendExportMetaTail(
  conversion: AnyRec,
  opts?: {
    // If you know the page title or URL, pass them for a better `name` value
    pageTitle?: string;
    pageUrl?: string;
    yooessentialsVersion?: string; // if you have it
    sourceDefault?: { limit?: number; cache?: number };
  }
) {
  const yv = String(conversion?.yootheme?.version ?? '4.x');
  const yess = opts?.yooessentialsVersion ?? String(conversion?.yootheme?.yooessentialsVersion ?? '');
  const modified = new Date().toISOString();
  const name = toLibraryName(opts?.pageUrl, { title: opts?.pageTitle });

  // Scan builder for bindings
  const builderConfig = conversion?.yootheme?.builder_config;
  const scan = extractBindingsFromBuilder(builderConfig);

  const tail: ExportTail = {
    version: yv,
    yooessentialsVersion: yess,
    modified,
    name,
    props: [],
  };

  // If we found any bindings, include a query + props block that mirrors your example
  const propKeys = Object.keys(scan.props);
  if (propKeys.length > 0) {
    tail.source = {
      query: scan.lastQueryName
        ? {
            name: scan.lastQueryName,
            arguments: {
              offset: 0,
              limit: opts?.sourceDefault?.limit ?? 999,
              cache: opts?.sourceDefault?.cache ?? 0,
            },
          }
        : undefined,
      props: scan.props,
    };
  }

  // Ensure this becomes the *last* property by re-building object in order
  const finalOut: AnyRec = {};
  for (const k of Object.keys(conversion)) finalOut[k] = (conversion as AnyRec)[k];
  finalOut.__exportTail = tail; // <<< will stringify as the last block
  return finalOut;
}

// ---- Real implementation ----
function doYourExistingConversion(scrapedData: AnyRec): AnyRec {
    // Basic conversion logic
    const sections = (scrapedData.markdown || '')
      .split('\n## ')
      .filter(Boolean)
      .map((sectionContent:string, index:number) => {
        const lines = sectionContent.split('\n');
        const title = index === 0 ? lines[0].replace('# ', '') : `Section ${index + 1}`;
        const content = lines.slice(1).join('\n');
        
        return {
          type: 'section',
          props: {
            style: 'default',
            width: 'default',
            vertical_align: 'middle',
            title_position: 'top',
            title_rotation: 'left',
            title_breakpoint: 'xl',
            image_position: 'center',
          },
          children: [
            {
              type: 'row',
              children: [
                {
                  type: 'column',
                  props: {
                    width_medium: '1-1',
                  },
                  children: [
                    {
                      type: 'headline',
                      props: {
                        content: title,
                        title_element: 'h2',
                      },
                    },
                    {
                      type: 'text',
                      props: {
                        content: content,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        };
      });

    return {
      joomla_version: '5.1',
      assets: {
        images: [], // Image extraction would be a more complex task
      },
      yootheme: {
        version: '4.4.12',
        template: 'yootheme',
        builder_config: {
          sections: sections,
        },
      },
    };
}


// Example: wire into your existing converter
// (adjust names to match your actual util)
export const JoomlaConverter = {
  convertWebsiteToJoomla(scraped: AnyRec) {
    // 1) Existing conversion (placeholder — your real logic lives here)
    const base = doYourExistingConversion(scraped); // <- replace with your function

    // 2) Append the export meta tail
    const finalWithTail = appendExportMetaTail(base, {
      pageTitle: scraped?.meta?.title,
      pageUrl: scraped?.meta?.url,
      // If you can detect YOOessentials version in your pipeline, pass it here.
      yooessentialsVersion: base?.yootheme?.yooessentialsVersion,
    });

    return finalWithTail;
  },
};
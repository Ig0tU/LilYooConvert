import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

// --- YOOtheme Type Definitions ---
interface YOOthemeSource {
  query: {
    name: string;
    arguments?: Record<string, any>;
  };
  props?: Record<string, any>;
}

interface YOOthemeElement {
  type: string;
  props?: Record<string, any>;
  source?: YOOthemeSource;
  children?: YOOthemeElement[];
  name?: string; // Added for sections/rows
}

interface WebsiteData {
  markdown: string;
  metadata: {
    title: string;
    description: string;
    sourceURL: string;
  };
}

// --- Main Converter Class ---
export class JoomlaConverter {

  /**
   * Converts scraped website data into a dynamic YOOtheme layout.
   */
  static convertWebsiteToJoomla(data: WebsiteData): YOOthemeElement {
    const { markdown, metadata } = data;

    // Create a unique ID for the data source
    const sourceId = `source_${Math.random().toString(36).substring(2, 10)}`;

    // The main layout structure
    const layout: YOOthemeElement = {
      type: "layout",
      children: [
        {
          type: "section",
          name: "Dynamic Content Section",
          props: {
            style: "default",
            vertical_align: "middle",
            width: "default",
          },
          // This is the key part: define the data source for this section.
          // We are creating a custom source with a single record containing the scraped data.
          source: {
            query: {
              name: "custom.record",
              arguments: {
                id: sourceId, // A unique ID for this data
                record: {
                  // The actual data being stored
                  title: metadata.title || "Scraped Content",
                  description: metadata.description || "",
                  content: markdown, // The full markdown content
                  source_url: metadata.sourceURL,
                },
              },
            },
          },
          children: [
            {
              type: "row",
              children: [
                {
                  type: "column",
                  props: { width_medium: "1-1" },
                  children: this.createDynamicElementsFromMarkdown(markdown),
                },
              ],
            },
          ],
        },
      ],
      // Metadata for the layout
      version: "4.5.24",
      modified: new Date().toISOString(),
      name: metadata.title || "Converted Layout",
      props: {},
    };

    return layout;
  }

  /**
   * Creates dynamic YOOtheme elements from markdown content.
   */
  private static createDynamicElementsFromMarkdown(markdown: string): YOOthemeElement[] {
    const elements: YOOthemeElement[] = [];

    // --- Title Element ---
    // This element will dynamically display the 'title' from the parent source.
    elements.push({
      type: "headline",
      props: {
        title_element: "h1",
        text_align: "left",
      },
      source: {
        query: { name: "#parent" }, // Refer to the parent data source (the section's source)
        props: {
          content: { name: "title" }, // Map the 'content' prop to the 'title' field
        },
      },
    });

    // --- Content Element ---
    // This element will dynamically display the 'content' (the full markdown) from the parent source.
    elements.push({
      type: "text",
      props: {
        margin: "default",
        column_breakpoint: "m",
      },
      source: {
        query: { name: "#parent" },
        props: {
          content: { name: "content" }, // Map the 'content' prop to the 'content' field
        },
      },
    });

    return elements;
  }
}

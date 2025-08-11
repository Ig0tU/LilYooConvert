import FirecrawlApp from '@mendable/firecrawl-js';

interface ScrapeResponse {
  success: true;
  data: {
    content: string;
    markdown: string;
    html: string;
    metadata: {
      title: string;
      description: string;
      language: string;
      sourceURL: string;
    };
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}


type ApiResponse = ScrapeResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  private static initializeApp(apiKey: string) {
    if (!this.firecrawlApp || this.firecrawlApp.apiKey !== apiKey) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
    }
  }

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.initializeApp(apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      this.initializeApp(apiKey);
      // Use scrapeUrl instead of crawlUrl for a lighter test
      const testResponse = await this.firecrawlApp.scrapeUrl('https://firecrawl.dev/docs');
      return testResponse.success;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async scrapeWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    this.initializeApp(apiKey);

    try {
      // Using scrapeUrl as requested
      const response: ApiResponse = await this.firecrawlApp.scrapeUrl(url, {
        formats: ["markdown", "html"], // Ensure both formats are requested
        onlyMainContent: true,
        maxAge: 14400000
      });

      if (!response.success) {
        return { 
          success: false, 
          error: (response as ErrorResponse).error || 'Failed to scrape website' 
        };
      }

      return { 
        success: true,
        data: (response as ScrapeResponse).data
      };
    } catch (error) {
      console.error('Error during scraping:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }
}

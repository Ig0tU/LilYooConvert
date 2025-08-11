import React, { useState } from 'react';
import { FirecrawlService } from '@/utils/firecrawl';
import { JoomlaConverter } from '@/utils/joomlaConverter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const ConversionResult: React.FC<{ data: any }> = ({ data }) => {
<<<<<<< HEAD
  const jsonString = JSON.stringify(data, null, 2);
=======
  const jsonString = JSON.stringify(data);
>>>>>>> ce47160 (Initial commit)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    toast({
      title: "Copied to clipboard",
      description: "The converted Joomla format JSON has been copied.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
<<<<<<< HEAD
    a.download = `${data.name || 'yootheme-layout'}.json`;
=======
    a.download = 'joomla-conversion.json';
>>>>>>> ce47160 (Initial commit)
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Converted Joomla Format</h2>
<<<<<<< HEAD
      <div className="space-y-4">
        {data?.children?.map((section: any, i: number) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">{section.name}</span>
              <Badge variant="outline">Section</Badge>
            </div>
            <div className="mt-2 ml-4 space-y-2">
              {section.children?.map((row: any, j: number) => (
                <div key={j} className="pl-4 border-l">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Row {j + 1}</span>
                    {row.props?.layout && (
                      <Badge variant="secondary">
                        Layout: {row.props.layout}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-x-2">
=======
      <Textarea
        readOnly
        value={jsonString}
        rows={20}
        className="font-mono text-sm"
      />
      <div className="mt-2 space-x-2">
>>>>>>> ce47160 (Initial commit)
        <Button onClick={handleCopy}>Copy to Clipboard</Button>
        <Button onClick={handleDownload}>Download JSON</Button>
      </div>
    </div>
  );
};

const Index = () => {
  const [url, setUrl] = useState('');
  const [conversionData, setConversionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>(FirecrawlService.getApiKey() || '');
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);

  const handleApiKeySave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }
    FirecrawlService.saveApiKey(apiKey.trim());
    toast({
      title: "API Key saved",
      description: "Your Firecrawl API key has been saved.",
    });
    validateApiKey(apiKey.trim());
  };

  const validateApiKey = async (key: string) => {
    setValidating(true);
    const result = await FirecrawlService.testApiKey(key);
    setApiKeyValid(result.success);
    setValidating(false);
    if (!result.success) {
      toast({
        title: "Invalid API Key",
        description: result.error || "The provided API key is invalid. Please check and try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "API Key Valid",
        description: "The provided API key is valid.",
        variant: "default",
      });
    }
  };

  React.useEffect(() => {
    if (apiKey) {
      validateApiKey(apiKey);
    }
  }, []);

  const handleConvert = async () => {
    if (!apiKeyValid) {
      toast({
        title: "API Key required",
        description: "Please provide a valid Firecrawl API key before converting.",
        variant: "destructive",
      });
      return;
    }
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid URL to convert.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const scrapeResult = await FirecrawlService.scrapeWebsite(url);
      if (!scrapeResult.success) {
        toast({
          title: "Scraping failed",
          description: scrapeResult.error || "Failed to scrape the website.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const conversion = JoomlaConverter.convertWebsiteToJoomla(scrapeResult.data);
      setConversionData(conversion);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <label htmlFor="api-key-input" className="block text-sm font-medium mb-1">
          Firecrawl API Key
        </label>
        <Input
          id="api-key-input"
          type="text"
          placeholder="Enter your Firecrawl API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={validating}
        />
        <Button onClick={handleApiKeySave} disabled={validating || !apiKey.trim()} className="mt-2">
          {validating ? 'Validating...' : 'Save API Key'}
        </Button>
        {apiKeyValid === false && (
          <p className="text-red-600 mt-1">Invalid API key. Please check and try again.</p>
        )}
      </div>
      <div>
        <label htmlFor="url-input" className="block text-sm font-medium mb-1">
          Enter URL to Convert
        </label>
        <Input
          id="url-input"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading || !apiKeyValid}
        />
      </div>
      <Button onClick={handleConvert} disabled={loading || !apiKeyValid || !url.trim()} className="w-full">
        {loading ? 'Converting...' : 'Convert URL'}
      </Button>
      {conversionData && <ConversionResult data={conversionData} />}
    </div>
  );
};

export default Index;

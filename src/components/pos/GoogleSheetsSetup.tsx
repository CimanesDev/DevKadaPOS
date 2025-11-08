import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface GoogleSheetsSetupProps {
  onSave: (url: string) => void;
  currentUrl?: string;
}

export const GoogleSheetsSetup = ({ onSave, currentUrl }: GoogleSheetsSetupProps) => {
  const [url, setUrl] = useState(currentUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!url.trim()) {
      return;
    }

    setIsSaving(true);
    // Save to localStorage for now (in production, you'd save to backend)
    localStorage.setItem("googleSheetsUrl", url);
    onSave(url);
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Sheets Configuration</CardTitle>
        <CardDescription>
          Connect your POS system to Google Sheets for inventory and sales tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Create a Google Sheet with tabs: "Products", "Sales", "Stock"</li>
              <li>Add all your products to the "Products" tab (ID, Name, Price, Category, Stock)</li>
              <li>Open Extensions → Apps Script</li>
              <li>Copy the code from google-apps-script.js</li>
              <li>Update SPREADSHEET_ID with your sheet ID</li>
              <li>Deploy as Web App (Anyone can access)</li>
              <li>Paste the Web App URL below</li>
            </ol>
            <p className="mt-2 text-xs font-semibold">
              Note: All products are loaded from Google Sheets. Add them to the Products tab.
            </p>
            <p className="mt-2 text-xs">
              <strong>Messenger API Setup:</strong> To receive low stock alerts via Messenger, configure the Messenger API in your Google Apps Script. See MESSENGER_API_SETUP.md for detailed instructions.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="sheetsUrl">Google Sheets Web App URL</Label>
          <Input
            id="sheetsUrl"
            type="url"
            placeholder="https://script.google.com/macros/s/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={!url.trim() || isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
};


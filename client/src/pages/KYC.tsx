import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Upload, CheckCircle2, Clock, XCircle, Shield } from "lucide-react";

export default function KYC() {
  const [documentType, setDocumentType] = useState<"id_card" | "passport" | "drivers_license">("id_card");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: kycStatus, refetch } = trpc.kyc.status.useQuery();

  const submitKyc = trpc.kyc.submit.useMutation({
    onSuccess: () => {
      toast.success("KYC documents submitted! Awaiting review.");
      setFrontImage(null);
      setBackImage(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (type === "front") {
      setFrontImage(file);
    } else {
      setBackImage(file);
    }
  };

  const handleSubmit = async () => {
    if (!frontImage) {
      toast.error("Please upload front image");
      return;
    }

    setUploading(true);

    try {
      // In production, upload to S3 using storagePut
      // For now, use placeholder URLs
      const frontUrl = `https://placeholder.com/${frontImage.name}`;
      const backUrl = backImage ? `https://placeholder.com/${backImage.name}` : undefined;

      await submitKyc.mutateAsync({
        documentType,
        frontImageUrl: frontUrl,
        backImageUrl: backUrl,
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Approved</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 text-yellow-500">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Pending Review</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
          <p className="text-muted-foreground">Verify your identity to unlock all features</p>
        </div>

        {/* Current Status */}
        {kycStatus && (
          <Card className="glass border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Verification Status</span>
                {getStatusBadge(kycStatus.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document Type:</span>
                <span className="font-medium capitalize">{kycStatus.documentType.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">{new Date(kycStatus.createdAt).toLocaleDateString()}</span>
              </div>
              {kycStatus.adminNote && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="font-medium text-red-500 mb-1">Admin Note:</p>
                  <p className="text-sm">{kycStatus.adminNote}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        {(!kycStatus || kycStatus.status === "rejected") && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Submit Verification Documents
              </CardTitle>
              <CardDescription>
                Upload clear photos of your government-issued ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={(v: any) => setDocumentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id_card">National ID Card</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label>Front Side *</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "front")}
                      className="hidden"
                      id="front-upload"
                    />
                    <label htmlFor="front-upload" className="cursor-pointer">
                      {frontImage ? (
                        <div>
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p className="text-sm font-medium">{frontImage.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(frontImage.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Back Side {documentType !== "passport" && "*"}</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "back")}
                      className="hidden"
                      id="back-upload"
                    />
                    <label htmlFor="back-upload" className="cursor-pointer">
                      {backImage ? (
                        <div>
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p className="text-sm font-medium">{backImage.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(backImage.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Document must be valid and not expired</li>
                  <li>All text and photo must be clearly visible</li>
                  <li>No glare or shadows on the document</li>
                  <li>Full document must be in frame</li>
                </ul>
              </div>

              <Button
                className="w-full gradient-primary"
                onClick={handleSubmit}
                disabled={!frontImage || uploading || submitKyc.isPending}
              >
                {uploading || submitKyc.isPending ? "Uploading..." : "Submit for Verification"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Why Verify?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Higher Limits</p>
                  <p className="text-sm text-muted-foreground">Increase your deposit and withdrawal limits</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Faster Processing</p>
                  <p className="text-sm text-muted-foreground">Priority processing for all transactions</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Enhanced Security</p>
                  <p className="text-sm text-muted-foreground">Additional protection for your account</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

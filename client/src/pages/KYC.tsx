import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Upload, FileText, User, MapPin } from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "id_card", label: "National ID Card" },
  { value: "drivers_license", label: "Driver's License" },
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Singapore",
  "Japan",
  "South Korea",
  "Other",
];

export default function KYC() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    documentType: "",
    documentNumber: "",
  });

  const [files, setFiles] = useState({
    documentFront: null as File | null,
    documentBack: null as File | null,
    selfie: null as File | null,
  });

  // Get KYC status
  const { data: kycStatus, refetch } = trpc.kyc.status.useQuery();

  // Submit KYC mutation
  const submitKYC = trpc.kyc.submit.useMutation({
    onSuccess: () => {
      toast.success("KYC documents submitted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles({ ...files, [field]: file });
  };

  const handleSubmit = async () => {
    // Validate all fields
    const requiredFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "nationality",
      "address",
      "city",
      "postalCode",
      "country",
      "documentType",
      "documentNumber",
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return;
      }
    }

    if (!files.documentFront || !files.selfie) {
      toast.error("Please upload required documents");
      return;
    }

    // In production, upload files to S3 first and get URLs
    // For now, we'll use placeholder URLs
    const documentFrontUrl = "https://placeholder.com/document-front.jpg";
    const documentBackUrl = files.documentBack ? "https://placeholder.com/document-back.jpg" : undefined;
    const selfieUrl = "https://placeholder.com/selfie.jpg";

    submitKYC.mutate({
      ...formData,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
    });
  };

  const getStatusBadge = () => {
    if (!kycStatus) return null;

    switch (kycStatus.status) {
      case "approved":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-600">
            <Clock className="w-4 h-4 mr-1" />
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-600">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">KYC Verification</h1>
          <p className="text-slate-400">Complete your identity verification to unlock all features</p>
        </div>

        {/* Status Card */}
        {kycStatus && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Verification Status</span>
                {getStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kycStatus.status === "approved" && (
                <Alert className="bg-green-900/20 border-green-500/50">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    Your identity has been verified. You now have access to all platform features.
                  </AlertDescription>
                </Alert>
              )}
              {kycStatus.status === "pending" && (
                <Alert className="bg-yellow-900/20 border-yellow-500/50">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    Your documents are under review. This typically takes 1-3 business days.
                  </AlertDescription>
                </Alert>
              )}
              {kycStatus.status === "rejected" && (
                <Alert className="bg-red-900/20 border-red-500/50">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    Your verification was rejected. Reason: {kycStatus.rejectionReason || "Please contact support"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Benefits Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold text-white mb-4">Why verify your identity?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Higher Limits</div>
                  <div className="text-sm text-blue-100">Increase deposit and withdrawal limits</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Advanced Features</div>
                  <div className="text-sm text-blue-100">Access margin trading and futures</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Enhanced Security</div>
                  <div className="text-sm text-blue-100">Protect your account from unauthorized access</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Priority Support</div>
                  <div className="text-sm text-blue-100">Get faster response from our team</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Form */}
        {(!kycStatus || kycStatus.status === "rejected") && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <User className="w-5 h-5" />
                  <span>Personal Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">First Name *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Last Name *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Nationality *</Label>
                    <Select
                      value={formData.nationality}
                      onValueChange={(value) => handleInputChange("nationality", value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <MapPin className="w-5 h-5" />
                  <span>Address</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-slate-400">Street Address *</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-400">City *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400">Postal Code *</Label>
                      <Input
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400">Country *</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => handleInputChange("country", value)}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FileText className="w-5 h-5" />
                  <span>Identity Document</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Document Type *</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => handleInputChange("documentType", value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((doc) => (
                          <SelectItem key={doc.value} value={doc.value}>
                            {doc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-400">Document Number *</Label>
                    <Input
                      value={formData.documentNumber}
                      onChange={(e) => handleInputChange("documentNumber", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Upload className="w-5 h-5" />
                  <span>Upload Documents</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400">Document Front *</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-slate-400" />
                          <p className="text-xs text-slate-400">
                            {files.documentFront ? files.documentFront.name : "Click to upload"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange("documentFront", e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400">Document Back</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-slate-400" />
                          <p className="text-xs text-slate-400">
                            {files.documentBack ? files.documentBack.name : "Click to upload"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange("documentBack", e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400">Selfie with Document *</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-slate-400" />
                          <p className="text-xs text-slate-400">
                            {files.selfie ? files.selfie.name : "Click to upload"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange("selfie", e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  * Accepted formats: JPG, PNG, PDF (max 5MB per file)
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitKYC.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {submitKYC.isPending ? "Submitting..." : "Submit for Verification"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

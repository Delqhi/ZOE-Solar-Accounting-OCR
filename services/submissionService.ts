// services/submissionService.ts
// Client for the OCI Submission Backend

export interface UstvaValidationRequest {
  period: string; // e.g., "2024Q1" or "202401"
  data: any; // UStVA data
}

export interface UstvaSubmissionRequest extends UstvaValidationRequest {
  pfxFile: File;
  pfxPassword: string;
}

export interface SubmissionResponse {
  success: boolean;
  ticket?: string;
  error?: string;
}

export const validateUstva = async (
  baseUrl: string,
  request: UstvaValidationRequest,
  apiKey?: string
): Promise<SubmissionResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${baseUrl}/ustva/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const submitUstva = async (
  baseUrl: string,
  request: UstvaSubmissionRequest,
  apiKey?: string
): Promise<SubmissionResponse> => {
  // Convert PFX file to base64
  const pfxData = await fileToBase64(request.pfxFile);

  const payload = {
    period: request.period,
    data: request.data,
    pfxData,
    pfxPassword: request.pfxPassword,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${baseUrl}/ustva/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
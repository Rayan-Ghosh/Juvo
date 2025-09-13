// src/lib/types.ts

export interface VitalLog {
    id: string;
    bp?: string; // Blood Pressure e.g. "120/80"
    stress?: number;
    spo2?: number; // Blood oxygen saturation
    createdAt: Date;
}

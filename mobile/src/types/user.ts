export interface User {
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  verified: boolean;
  lastLocation?: {
    lat: number;
    lng: number;
  };
  fcmTokens: string[];
}

export interface Alert {
  alertId: string;
  title: string;
  category: 'missing_person' | 'stolen_vehicle' | 'missing_elderly';
  description: string;
  photoUrl: string;
  lastSeen: {
    lat: number;
    lng: number;
  };
  lastSeenAt: Date;
  createdBy: string;
  createdAt: Date;
  active: boolean;
  radiusKm: number;
  sightingCount?: number;
  lastSightingAt?: Date;
  lastUpdated?: Date;
}

export interface Sighting {
  sightingId: string;
  alertId: string;
  reportedBy: string;
  location: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  timestamp: Date;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface AlertCategory {
  value: 'missing_person' | 'stolen_vehicle' | 'missing_elderly';
  label: string;
  emoji: string;
}
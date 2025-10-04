export interface Landmark {
    id: number;
    province: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }

export interface LandmarksByProvince {
    [province: string]: Landmark[];
  }
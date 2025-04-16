interface UserLocationInfo {
    fullAddress: string;
    formattedCep: string;
    userCoordinates: {
      lat: number;
      lng: number;
    };
    locationInfo: {
      logradouro: string;
      localidade: string;
      uf: string;
      cep: string;
      bairro: string;
      [key: string]: any;
    };
  }
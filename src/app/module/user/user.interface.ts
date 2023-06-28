export interface IUser {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  contactNumber: string;
  education?: string;
  dateOfBirth?: string;
  gender: string;
  fatherName: string;
  motherName: string;
  adderss: string;
  role: string;
  title: string;
  description: string;
  responsible: string;
  location: string;
  area: string;
  expertise: string[];
  expecting: string[];
  threeMainExpertise: string[];
  packages: {
    package1: string;
    package2: string;
    package3: string;
  };
  prices: {
    price1: number;
    price2: number;
    price3: number;
  };
  rating: number;
  img: string;
  cover1: string;
  cover2: string;
}

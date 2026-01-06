export type Availability = "W" | "S" | "B";
export type Frequency = "yearly" | "biyearly";

export interface Module {
  code: string;
  name: string;
  credits: number;
}

export interface Course {
  id: string | string[];
  name: string | string[];
  module: Module[];
  subcategory: string | string[];
  type: string | string[];
  credits: number | number[];
  // 0 = not required, 1 = required in major, 2 = required in major & minor
  // 0 = Freifach, 1 = Wahlfach, 2 = Pflichtfach
  required: number | number[];
  availability: Availability | Availability[];
  recommended_semester: number | number[];
  prerequisites: Course[];
  frequency: Frequency | Frequency[];
  language: string | string[];
  description: string | string[];
  url: string | string[];
}

export interface Curriculum {
  credits: number;
  modules: Module[];
  courses: Course[];
}

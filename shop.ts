export interface Shop {
    _id: String;
    name: String;
    address: String;
    ward: String;
    phone: String;
    type: String;
    isValid: boolean | undefined;
    validBefore: Date | undefined;
}

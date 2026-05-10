export class CarCalculator {
    CUSTOMS_FEE = 40; // в EUR
  
    calculate(data) {
      // data: { engineType, personType, priceEur, engineVolumeCm3, ageCategory, isPrivileged }
      let duty =
        data.engineType === 'electric'
          ? data.personType === 'physical'
            ? 0
            : data.priceEur * 0.15
          : data.personType === 'physical'
            ? this.calculatePhysicalFuelDuty(data)
            : this.calculateLegalFuelDuty(data);
  
      let discountedDuty =
        data.isPrivileged && data.personType === 'physical'
          ? duty * 0.5
          : duty;
  
      let utilizationFee =
        data.personType === 'physical'
          ? data.ageCategory === 'new' ? 150 : 220 // Ставки физлиц (упрощенно)
          : data.ageCategory === 'new' ? 1200 : 2500;
  
      return {
        customsDuty: Math.round(discountedDuty),
        utilizationFee: Math.round(utilizationFee),
        customsFee: this.CUSTOMS_FEE,
        totalEur: Math.round(discountedDuty + utilizationFee + this.CUSTOMS_FEE)
      };
    }
  
    calculatePhysicalFuelDuty(data) {
      let { ageCategory, engineVolumeCm3, priceEur } = data;
      if (ageCategory === 'new') {
        if (priceEur <= 8500) return Math.max(priceEur * 0.54, engineVolumeCm3 * 2.5);
        if (priceEur <= 16700) return Math.max(priceEur * 0.48, engineVolumeCm3 * 3.5);
        if (priceEur <= 42300) return Math.max(priceEur * 0.48, engineVolumeCm3 * 5.5);
        if (priceEur <= 84500) return Math.max(priceEur * 0.48, engineVolumeCm3 * 7.5);
        if (priceEur <= 169000) return Math.max(priceEur * 0.48, engineVolumeCm3 * 15);
        return Math.max(priceEur * 0.48, engineVolumeCm3 * 20);
      }
      if (ageCategory === 'medium') {
        if (engineVolumeCm3 <= 1000) return engineVolumeCm3 * 1.5;
        if (engineVolumeCm3 <= 1500) return engineVolumeCm3 * 1.7;
        if (engineVolumeCm3 <= 1800) return engineVolumeCm3 * 2.5;
        if (engineVolumeCm3 <= 2300) return engineVolumeCm3 * 2.7;
        if (engineVolumeCm3 <= 3000) return engineVolumeCm3 * 3;
        return engineVolumeCm3 * 3.6;
      }
      // old
      if (engineVolumeCm3 <= 1000) return engineVolumeCm3 * 3;
      if (engineVolumeCm3 <= 1500) return engineVolumeCm3 * 3.2;
      if (engineVolumeCm3 <= 1800) return engineVolumeCm3 * 3.5;
      if (engineVolumeCm3 <= 2300) return engineVolumeCm3 * 4.8;
      if (engineVolumeCm3 <= 3000) return engineVolumeCm3 * 5;
      return engineVolumeCm3 * 5.7;
    }
  
    calculateLegalFuelDuty(data) {
      let duty = data.priceEur * 0.15;
      return duty + (data.priceEur + duty) * 0.2;
    }
  }
export class BelarusCustomsCalculator {
  CUSTOMS_FEE = 40;

  calculate(car) {
      // car: { priceEur, ageCategory, engineVolumeCm3, engineType, isPrivileged, personType }
      const baseDuty = car.engineType === 'electric'
          ? (car.personType === 'physical' ? 0 : car.priceEur * 0.15)
          : (car.personType === 'physical'
              ? this.calculatePhysicalFuelDuty(car)
              : this.calculateLegalFuelDuty(car));

      const finalDuty = (car.isPrivileged && car.personType === 'physical')
          ? baseDuty * 0.5
          : baseDuty;

      const utilFee = car.personType === 'physical'
          ? (car.ageCategory === 'new' ? 150 : 220)
          : 1200;

      return {
          customsDuty: Math.round(finalDuty),
          utilizationFee: utilFee, // Внимание: утильсбор по закону в BYN, но в этом классе он считается как число (добавим конвертацию снаружи)
          customsFee: this.CUSTOMS_FEE,
          totalEur: Math.round(finalDuty + this.CUSTOMS_FEE) // Утиль добавим в BYN на клиенте
      };
  }

  calculatePhysicalFuelDuty(car) {
      const { ageCategory, engineVolumeCm3, priceEur } = car;

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
          if (engineVolumeCm3 <= 3000) return engineVolumeCm3 * 3.0;
          return engineVolumeCm3 * 3.6;
      }

      // old
      if (engineVolumeCm3 <= 1000) return engineVolumeCm3 * 3.0;
      if (engineVolumeCm3 <= 1500) return engineVolumeCm3 * 3.2;
      if (engineVolumeCm3 <= 1800) return engineVolumeCm3 * 3.5;
      if (engineVolumeCm3 <= 2300) return engineVolumeCm3 * 4.8;
      if (engineVolumeCm3 <= 3000) return engineVolumeCm3 * 5.0;
      return engineVolumeCm3 * 5.7;
  }

  calculateLegalFuelDuty(car) {
      const baseDuty = car.priceEur * 0.15;
      const vat = (car.priceEur + baseDuty) * 0.20;
      return baseDuty + vat;
  }
}
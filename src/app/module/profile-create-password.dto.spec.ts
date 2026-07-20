import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCareDto } from './care/dto/create-care.dto';
import { CreateCompanyDto } from './company/dto/create-company.dto';
import { CreateFamilyDto } from './family/dto/create-family.dto';

const expectPasswordError = async (dtoClass: any, payload: object) => {
  const dto = plainToInstance(dtoClass, payload);
  const errors = await validate(dto);
  const passwordError = errors.find((error) => error.property === 'password');

  expect(passwordError).toBeDefined();
};

describe('profile creation password validation', () => {
  const familyPayload = {
    firstName: 'Jane',
    lastName: 'Family',
    email: 'family@example.com',
    password: 'secret123',
    phoneNumber: '+447700900123',
    postCode: 'SW1A 1AA',
    city: 'London',
    street: 'Downing Street',
  };

  const companyPayload = {
    companyName: 'Bedders Care Ltd',
    email: 'company@example.com',
    password: 'secret123',
    phoneNumber: '+447700900123',
    registerNumber: 'REG-123',
    address: 'London',
    location: {
      type: 'Point',
      coordinates: [-0.1278, 51.5074],
    },
    postCode: 'SW1A 1AA',
  };

  const carerPayload = {
    careName: 'Jane Carer',
    phoneNumber: '+447700900123',
    email: 'carer@example.com',
    password: 'secret123',
    dateOfBirth: '1995-08-15',
    gender: 'female',
    address: 'London',
    postCode: 'SW1A 1AA',
    location: {
      type: 'Point',
      coordinates: [-0.1278, 51.5074],
    },
    shifts: 'Day',
  };

  it('rejects missing passwords for company and carer profile creation', async () => {
    const { password: companyPassword, ...companyWithoutPassword } =
      companyPayload;
    const { password: carerPassword, ...carerWithoutPassword } = carerPayload;

    expect(companyPassword).toBe('secret123');
    expect(carerPassword).toBe('secret123');
    await expectPasswordError(CreateCompanyDto, companyWithoutPassword);
    await expectPasswordError(CreateCareDto, carerWithoutPassword);
  });

  it('rejects short passwords for family, company, and carer profile creation', async () => {
    await expectPasswordError(CreateFamilyDto, {
      ...familyPayload,
      password: '123',
    });
    await expectPasswordError(CreateCompanyDto, {
      ...companyPayload,
      password: '123',
    });
    await expectPasswordError(CreateCareDto, {
      ...carerPayload,
      password: '123',
    });
  });
});

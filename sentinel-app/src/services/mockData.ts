import { RegisteredUser, PersonType } from '../types';

export const MOCK_USERS: RegisteredUser[] = [
  {
    id: 't1',
    name: 'Dr. Sarah Wilson',
    type: PersonType.TEACHER,
    photo: 'https://picsum.photos/seed/sarah/200/200',
    subject: 'Advanced Mathematics',
    registrationDate: new Date().toISOString()
  },
  {
    id: 's1',
    name: 'Alex Johnson',
    type: PersonType.STUDENT,
    photo: 'https://picsum.photos/seed/alex/200/200',
    rollNo: '2024CS01',
    age: 20,
    branch: 'Computer Science',
    registrationDate: new Date().toISOString()
  },
  {
    id: 's2',
    name: 'Emma Thompson',
    type: PersonType.STUDENT,
    photo: 'https://picsum.photos/seed/emma/200/200',
    rollNo: '2024CS02',
    age: 21,
    branch: 'Computer Science',
    registrationDate: new Date().toISOString()
  },
  {
    id: 's3',
    name: 'Michael Chen',
    type: PersonType.STUDENT,
    photo: 'https://picsum.photos/seed/michael/200/200',
    rollNo: '2024CS03',
    age: 20,
    branch: 'Computer Science',
    registrationDate: new Date().toISOString()
  }
];

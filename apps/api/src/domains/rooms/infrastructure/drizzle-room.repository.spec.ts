import { Room } from '../domain/room.entity';
import { DrizzleRoomRepository } from './drizzle-room.repository';

const mockRoom: Room = Room.create({
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: '스터디룸 A',
  description: '스터디룸 설명',
  capacity: 4,
  isActive: true,
  createdBy: '550e8400-e29b-41d4-a716-446655440001',
  createdAt: new Date('2026-09-02T00:00:00.000Z'),
});

describe('DrizzleRoomRepository', () => {
  it('finds all rooms', async () => {
    const mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockResolvedValue([
          {
            id: mockRoom.roomId,
            name: mockRoom.name,
            description: mockRoom.description,
            capacity: mockRoom.capacity,
            isActive: mockRoom.isActive,
            createdBy: mockRoom.createdBy,
            createdAt: mockRoom.createdAt,
          },
        ]),
      }),
    };
    const repository = new DrizzleRoomRepository(mockDb as never);

    const result = await repository.findAll();

    expect(result).toEqual([mockRoom]);
  });

  it('finds a room by id', async () => {
    const mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: mockRoom.roomId,
              name: mockRoom.name,
              description: mockRoom.description,
              capacity: mockRoom.capacity,
              isActive: mockRoom.isActive,
              createdBy: mockRoom.createdBy,
              createdAt: mockRoom.createdAt,
            },
          ]),
        }),
      }),
    };
    const repository = new DrizzleRoomRepository(mockDb as never);

    const result = await repository.findById(mockRoom.roomId);

    expect(result).toEqual(mockRoom);
  });
});

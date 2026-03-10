/**
 * Use Case: Get Friends
 * Busca a lista de amigos aceitos do student.
 */

import { db } from "@/lib/db";

export interface GetFriendsInput {
  studentId: string;
}

export interface FriendDTO {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
}

export interface GetFriendsOutput {
  count: number;
  list: FriendDTO[];
}

export async function getFriendsUseCase(
  input: GetFriendsInput,
): Promise<GetFriendsOutput> {
  const { studentId } = input;

  const friendships = await db.friendship.findMany({
    where: {
      userId: studentId,
      status: "accepted",
    },
    include: {
      friend: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  const list: FriendDTO[] = friendships.map((f) => ({
    id: f.friend.id,
    name: f.friend.user.name,
    avatar: f.friend.user.image || undefined,
    username: undefined,
  }));

  return { count: list.length, list };
}

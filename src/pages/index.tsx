import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../utils/api";
import { useState } from "react";
import { util } from "zod";

const GuestbookEntries = () => {
  const { data: guestbookEntries, isLoading } = api.guestbook.getAll.useQuery();

  if (isLoading) {
    return <div>Fetching messages ...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {guestbookEntries?.map((entry, index) => {
        return (
          <div key={index}>
            <p>{entry.message}</p>
            <span>- {entry.name}</span>
          </div>
        );
      })}
    </div>
  );
};

const Form = () => {
  const [message, setMessage] = useState("");
  const { data: session, status } = useSession();
  const utils = api.useContext();

  const postMessage = api.guestbook.postMessage.useMutation({
    onMutate: async (newMessage) => {
      await utils.guestbook.getAll.cancel();
      utils.guestbook.getAll.setData(undefined, (prevEntries) => {
        if (prevEntries) {
          return [newMessage, ...prevEntries];
        } else {
          return [newMessage];
        }
      });
    },
    onSettled: async () => {
      await utils.guestbook.getAll.invalidate();
    },
  });

  if (status !== "authenticated") return null;

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        postMessage.mutate({
          name: session.user?.name as string,
          message,
        });
        setMessage("");
      }}
    >
      <input
        type="text"
        className="rounded-md border-2 border-zinc-800 bg-neutral-900 px-4 py-2 focus:outline-none"
        placeholder="Your message..."
        minLength={2}
        maxLength={100}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        type="submit"
        className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
      >
        Submit
      </button>
    </form>
  );
};

const Home = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading....</main>;
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="pt-4 text-3xl">Guest Book</h1>
      <p>
        Tutorial for <code>create-t3-app</code>
      </p>
      <div className="pt-10">
        <div>
          {session ? (
            <>
              <p className="mb-4 text-center">Hi {session.user?.name}</p>
              <button
                className="mx-auto block rounded-md bg-neutral-800 py-3 px-6 text-center hover:bg-neutral-700"
                onClick={() => signOut().catch(console.log)}
              >
                Logout
              </button>
              <div className="pt-6">
                <Form />
              </div>
            </>
          ) : (
            <button
              className="mx-auto block rounded-md bg-neutral-800 py-3 px-6 text-center hover:bg-neutral-700"
              onClick={() => {
                signIn("discord").catch(console.log);
              }}
            >
              Login with Discord
            </button>
          )}
          <div className="pt-10">
            <GuestbookEntries />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;

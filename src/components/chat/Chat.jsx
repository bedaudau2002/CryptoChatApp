import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import E2EE from "@chatereum/react-e2ee";
import { JSEncrypt } from "jsencrypt";
const Chat = () => {
  const [chat, setChat] = useState([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [isFileSelected, setIsFileSelected] = useState(false);
  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  // let privateKey;
  // const handleFileSelect = (event) => {
  //   const file = event.target.files[0];
  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     privateKey = event.target.result;
  //     // Use privateKey for encryption...
  //     setIsFileSelected(true);
  //   };
  //   reader.readAsText(file);
  //   //console.log(privateKey);
  // };
  // function decryptText(encrypted) {
  //   try {
  //     const decrypted = E2EE.decryptForPlaintext({
  //       encrypted_text: encrypted,
  //       private_key: privateKey,
  //     });
  //     console.log(decrypted);
  //     return decrypted;
  //   } catch (err) {
  //     console.log(err);
  //     return "";
  //   }
  // }
  const [privateKey, setPrivateKey] = useState(null);
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      setPrivateKey(event.target.result);
      await setIsFileSelected(true);
      //await decryptText(message.text);
      console.log(privateKey);
    };
    reader.readAsText(file);
  };
  //let privateKey;
  // const handleFileSelect = async (event) => {
  //   const file = event.target.files[0];
  //   const reader = new FileReader();

  //   reader.onload = function (event) {
  //     const privateKeyString = event.target.result;
  //     console.log(privateKeyString);
  //     // Convert the private key to an ArrayBuffer
  //     const privateKeyBuffer = new TextEncoder().encode(privateKeyString);
  //     privateKey = window.crypto.subtle.importKey(
  //       "pkcs8",
  //       privateKeyBuffer,
  //       {
  //         name: "RSA-OAEP",
  //         hash: { name: "SHA-256" },
  //       },
  //       false,
  //       ["decrypt"],
  //     );
  //   };

  //   reader.readAsText(file);
  // };

  async function decryptText(encrypted) {
    try {
      const decrypted = await E2EE.decryptForPlaintext({
        encrypted_text: encrypted,
        private_key: privateKey,
      });
      console.log(decrypted);
      return decrypted;
    } catch (err) {
      console.error("Decryption failed:", err);
    }
  }

  const handleSend = async () => {
    if (text === "") return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      const userIDs = [currentUser.id, user.id];

      // const encText = await E2EE.encryptPlaintext({
      //   public_key: currentUser.public_key, // Use the current user's public key
      //   plain_text: text,
      // });
      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId,
          );
          const encText = await E2EE.encryptPlaintext({
            public_key: userChatsData.chats[chatIndex].pubKey,
            plain_text: text,
          });

          userChatsData.chats[chatIndex].lastMessage = encText.cipher_text;
          userChatsData.chats[chatIndex].AESKey = encText.aes_key;
          userChatsData.chats[chatIndex].iv = encText.iv;
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(doc(db, "chats", chatId), {
            messages: arrayUnion({
              senderId: currentUser.id,
              text: encText,
              createdAt: new Date(),
              ...(imgUrl && { img: imgUrl }),
            }),
          });
          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (err) {
      console.log(err);
    } finally {
      setImg({
        file: null,
        url: "",
      });

      setText("");
    }
  };
  function ChatMessage({ message }) {
    const [decryptedText, setDecryptedText] = useState("");

    useEffect(() => {
      decryptText(message.text).then(setDecryptedText);
    }, [message]);

    return <p>{decryptedText}</p>;
  }
  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Lorem ipsum dolor, sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <label htmlFor="file">
            <img src="./info.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          {/* <input type="file" onChange={handleFileSelect}>
    </div>        <img src="./info.png" alt="" />
          </input> */}
        </div>
      </div>
      {isFileSelected ? (
        <div className="center">
          {chat?.messages?.map((message, index) => (
            <div
              className={
                message.senderId === currentUser?.id ? "message own" : "message"
              }
              key={index}
            >
              <div className="texts">
                {message.img && <img src={message.img} alt="" />}
                {/* <p>{message.text.cipher_text}</p> */}
                <p>{console.log(privateKey)}</p>
                <ChatMessage message={message} />
                <span>{format(message.createdAt.toDate())}</span>
              </div>
            </div>
          ))}
          {img.url && (
            <div className="message own">
              <div className="texts">
                <img src={img.url} alt="" />
              </div>
            </div>
          )}
          <div ref={endRef}></div>
        </div>
      ) : (
        <div className="center">
          {chat?.messages?.map((message, index) => (
            <div
              className={
                message.senderId === currentUser?.id ? "message own" : "message"
              }
              key={index}
            >
              <div className="texts">
                {message.img && <img src={message.img} alt="" />}
                <p>{message.text.cipher_text}</p>
                {/* <p>{console.log(message)}</p> */}
                {/* <p>{decryptText(message.text)}</p> */}
                {/* {isFileSelected ? (
                <p>{decryptText(message[5].text)}</p>
              ) : (
                <p>{message.text.cipher_text}</p>
              )} */}
                <span>{format(message.createdAt.toDate())}</span>
              </div>
            </div>
          ))}
          {img.url && (
            <div className="message own">
              <div className="texts">
                <img src={img.url} alt="" />
              </div>
            </div>
          )}
          <div ref={endRef}></div>
        </div>
      )}
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;

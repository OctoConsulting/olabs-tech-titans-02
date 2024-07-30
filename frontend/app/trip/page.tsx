import Chat from "@/components/prebuilt/chat-trip";
// import Charts from "./@charts/page"

export default function Home() {
  return (
      <div className="w-full">
        {/* <p className="text-[28px] text-center font-medium">
          Generative UI with{" "}
          <a
            href="https://github.com/langchain-ai/langchainjs"
            target="_blank"
            className="text-blue-600 hover:underline hover:underline-offset-2"
          >
            LangChain Python 🦜🔗
          </a>
        </p> */}
        <Chat/>
        
      </div>
  );
}

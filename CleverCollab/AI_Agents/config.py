from langchain_openai import ChatOpenAI, OpenAIEmbeddings
import os
from dotenv import load_dotenv
load_dotenv()

llm = ChatOpenAI(api_key=os.environ.get("OPENAI_API_KEY"),model="gpt-4-turbo", temperature=0)
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

from langchain_community.vectorstores import FAISS
from config import embeddings

class SkillMatcher:
    def __init__(self, employees):
        self.store = FAISS.from_texts(
            texts=[f"{e.name}: {', '.join(e.skills)}" for e in employees],
            metadatas=[e.to_dict() for e in employees],
            embedding=embeddings
        )

    def find_match(self, skills, k=3):
        docs = self.store.similarity_search(" ".join(skills), k=k)
        return [doc.metadata for doc in docs]

"""Functions for Retrieval Augmented Generation (RAG)."""

import logging
from operator import itemgetter
from typing import List, Dict, Any, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI

# Local imports
from app.ai.vectorstore import query_similar_notes
from app.ai.embeddings import get_embedding_function  # May not be directly needed here
from app.core.config import settings

logger = logging.getLogger(__name__)

# --- Helper Function to format retrieved documents ---
def format_docs(docs: List[Dict[str, Any]]) -> str:
    """Formats the retrieved document content for the prompt.
       Extracts only the 'page_content' from each document.
    """
    content_list = []
    for i, doc_dict in enumerate(docs):
        # Extract page_content from the structure returned by query_similar_notes
        content = doc_dict.get('page_content', '') 
        if content:
            content_list.append(content)
        else:
            # Log warning if page_content is missing from the dictionary
            logger.warning(f"Document dict at index {i} has no 'page_content'. Data: {doc_dict}")
            
    # Join the extracted content blocks with double newlines
    return "\n\n".join(content_list)


# --- RAG Function ---

async def generate_rag_answer(query: str, user_id: int) -> Dict[str, Any]:
    """Generates an answer using RAG based on user's query and notes."""
    logger.info(f"Starting RAG generation for user {user_id}, query: '{query[:50]}...'")

    try:
        # 1. Retrieve relevant documents
        retrieved_docs = query_similar_notes(query_text=query, user_id=user_id, top_k=4)
        logger.debug(f"Retrieved documents raw structure: {retrieved_docs}")

        if not retrieved_docs:
            logger.warning(f"No relevant documents found for user {user_id}, query: '{query[:50]}...'")
            return {
                "answer": "I couldn't find any relevant information in your notes to answer that question.",
                "sources": []
            }

        logger.info(f"Retrieved {len(retrieved_docs)} documents for RAG.")

        # 2. Define RAG Prompt Template (Improved Instructions)
        template = """
        You are a helpful assistant. Answer the following question based ONLY on the context provided below.
        Keep your answer concise and informative.
        
        Context:
        {context}
        
        Question: {question}
        
        Answer:
        """
        prompt = ChatPromptTemplate.from_template(template)
        logger.debug(f"Using RAG Prompt Template:\n---\n{template}\n---")

        # 3. Initialize LLM
        llm = ChatOpenAI(
            model_name="gpt-4o-mini",
            temperature=0.2,
            api_key=settings.OPENAI_API_KEY
        )

        # 4. Create RAG Chain using LCEL
        def log_prompt(prompt_value):
            logger.debug(f"Formatted prompt being sent to LLM:\n---\n{prompt_value}\n---")
            return prompt_value

        rag_chain = (
            {
                "context": itemgetter("retrieved_docs") | RunnableLambda(format_docs),
                "question": itemgetter("question")
            }
            | prompt
            | RunnableLambda(log_prompt)
            | llm
            | StrOutputParser()
        )

        # 5. Invoke Chain
        logger.info("Invoking RAG chain...")
        chain_input = {
            "question": query,
            "retrieved_docs": retrieved_docs
        }
        logger.debug(f"Chain input: {chain_input}")
        answer = await rag_chain.ainvoke(chain_input)
        logger.info("RAG chain finished.")
        logger.debug(f"LLM generated answer: {answer}")

        # 6. Format and Return Response (Including sources)
        sources = []
        for doc in retrieved_docs:
            metadata = doc.get('metadata', {})
            note_id = metadata.get('note_id') # Already converted to int in query_similar_notes
            title = metadata.get('title')
            if note_id is not None: # Ensure we have a note_id before adding
                sources.append({
                    "note_id": note_id,
                    "title": title or "Untitled Note" # Provide default if title is missing
                })

        logger.debug(f"Returning RAG answer with sources: {sources}")
        response_payload = {"answer": answer, "sources": sources}
        logger.debug(f"Final response payload being sent: {response_payload}") # Log the entire payload
        return response_payload

    except Exception as e:
        logger.exception(f"Error during RAG generation for user {user_id}, query '{query[:50]}...': {e}", exc_info=True)
        return {
            "answer": "Sorry, an error occurred while trying to answer your question.",
            "sources": []
        }

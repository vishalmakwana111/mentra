import logging
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.core.config import settings

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def suggest_tags_for_content(content: str) -> List[str]:
    """
    Analyzes text content using an LLM to suggest relevant tags.

    Args:
        content: The text content to analyze.

    Returns:
        A list of suggested tags, or an empty list if generation fails or content is empty.
    """
    if not content or not content.strip():
        logger.info("Content is empty, skipping tag suggestion.")
        return []

    logger.info(f"Suggesting tags for content (truncated): {content[:100]}...")

    try:
        # 2.4. Initialize LLM (Ensure OPENAI_API_KEY is set in your environment/settings)
        if not settings.OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY not configured. Cannot suggest tags.")
            return []

        llm = ChatOpenAI(
            model_name="gpt-4o-mini",
            temperature=0.2,
            api_key=settings.OPENAI_API_KEY
        )

        # 2.5. Define Prompt
        prompt_template = ChatPromptTemplate.from_template(
            """Analyze the following text and extract the 3 to 5 most relevant and concise keywords or tags.
Present the tags as a comma-separated list ONLY, with no introductory text or numbering.
Ensure tags are lowercase.
Example: artificial intelligence, machine learning, data science

Text:
{text_content}"""
        )

        # 2.6. Create LCEL Chain
        tag_chain = prompt_template | llm | StrOutputParser()

        # 2.7. Invoke Chain & Log Raw Output
        raw_llm_output = await tag_chain.ainvoke({"text_content": content})
        logger.info(f"Raw LLM Output for tags: {raw_llm_output}")

        # 2.8. Implement Output Parsing
        if not raw_llm_output:
             logger.warning("LLM returned empty output for tags.")
             return []

        # Split by comma, strip whitespace, convert to lowercase, filter empty strings
        tags = [tag.strip().lower() for tag in raw_llm_output.split(',') if tag.strip()]

        # Limit to a maximum of two tags
        tags = tags[:2]

        logger.info(f"Parsed tags (limited to 2): {tags}")
        return tags

    except Exception as e:
        # 2.9. Error Handling & Logging
        logger.error(f"Error suggesting tags: {e}", exc_info=True)
        return []

# Example usage (for potential direct testing)
if __name__ == '__main__':
    import asyncio
    import os
    # Make sure to load .env for local testing if needed
    # from dotenv import load_dotenv
    # load_dotenv()
    # settings.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") # Ensure key is loaded

    async def main():
        test_content = "LangChain Expression Language (LCEL) makes it easy to compose complex AI chains from simple components."
        # test_content_empty = ""
        # test_content_short = "AI"
        if settings.OPENAI_API_KEY:
            suggested_tags = await suggest_tags_for_content(test_content)
            print(f"Suggested tags: {suggested_tags}")
        else:
            print("Skipping example usage: OPENAI_API_KEY not found.")

    # asyncio.run(main()) # Requires Python 3.7+
    # For broader compatibility:
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
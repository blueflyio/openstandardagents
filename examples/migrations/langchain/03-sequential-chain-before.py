"""
LangChain Sequential Chain for Document Processing
This chain processes documents through multiple stages: extraction, analysis, and summarization
"""

from langchain.chains import LLMChain, SequentialChain
from langchain.chat_models import ChatAnthropic
from langchain.prompts import PromptTemplate

# Initialize LLM
llm = ChatAnthropic(
    model="claude-3-sonnet-20240229",
    temperature=0.3,
    max_tokens=4000
)

# Chain 1: Extract key information
extract_prompt = PromptTemplate(
    input_variables=["document"],
    template="""Extract the key information from the following document:

Document: {document}

Extract:
- Main topic
- Key points (bullet list)
- Entities mentioned (people, organizations, dates)

Extracted Information:"""
)

extract_chain = LLMChain(
    llm=llm,
    prompt=extract_prompt,
    output_key="extracted_info"
)

# Chain 2: Analyze sentiment and tone
analyze_prompt = PromptTemplate(
    input_variables=["extracted_info"],
    template="""Analyze the sentiment and tone of the following extracted information:

{extracted_info}

Provide:
- Overall sentiment (positive/negative/neutral)
- Tone (formal/informal/technical)
- Confidence level

Analysis:"""
)

analyze_chain = LLMChain(
    llm=llm,
    prompt=analyze_prompt,
    output_key="analysis"
)

# Chain 3: Generate summary
summarize_prompt = PromptTemplate(
    input_variables=["extracted_info", "analysis"],
    template="""Create a comprehensive summary based on the extracted information and analysis:

Extracted Information:
{extracted_info}

Analysis:
{analysis}

Generate a 2-3 paragraph executive summary that captures the essence of the document,
its key points, and the overall tone.

Summary:"""
)

summarize_chain = LLMChain(
    llm=llm,
    prompt=summarize_prompt,
    output_key="summary"
)

# Create sequential chain
overall_chain = SequentialChain(
    chains=[extract_chain, analyze_chain, summarize_chain],
    input_variables=["document"],
    output_variables=["extracted_info", "analysis", "summary"],
    verbose=True
)

# Example usage
if __name__ == "__main__":
    sample_document = """
    The Q4 2023 earnings report shows strong growth across all divisions.
    Revenue increased 25% year-over-year to $150M. The cloud services division
    led growth with 40% increase. CEO Jane Smith expressed optimism about 2024
    prospects, citing new product launches and market expansion plans.
    """

    result = overall_chain({"document": sample_document})
    print("Summary:", result["summary"])

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Product
from app.models.knowledge import KnowledgeEntry
from app.services.rag import rag_service


async def sync_products_to_knowledge(user_id: str, db: AsyncSession) -> int:
    result = await db.execute(
        select(Product).where(Product.user_id == user_id)
    )
    products = result.scalars().all()

    await db.execute(
        delete(KnowledgeEntry).where(
            KnowledgeEntry.user_id == user_id,
            KnowledgeEntry.source == "product",
        )
    )

    documents = []
    for p in products:
        entry = KnowledgeEntry(
            user_id=user_id,
            category="product",
            title=p.name,
            content=f"商品：{p.name}\nSKU：{p.sku}\n分类：{p.category}\n价格：{p.price}元\n"
                    f"成本：{p.cost}元\n供应商：{p.supplier or '未知'}\n"
                    f"标签：{p.tags or '无'}\n描述：{p.description or '无'}",
            source="product",
            source_ref=p.sku,
        )
        db.add(entry)
        documents.append({"title": p.name, "content": entry.content, "id": p.sku})

    await db.flush()

    if documents:
        await rag_service.add_documents(documents)

    return len(documents)


async def add_manual_entry(
    user_id: str,
    category: str,
    title: str,
    content: str,
    db: AsyncSession,
) -> KnowledgeEntry:
    entry = KnowledgeEntry(
        user_id=user_id,
        category=category,
        title=title,
        content=content,
        source="manual",
    )
    db.add(entry)
    await db.flush()

    await rag_service.add_documents([{
        "title": title,
        "content": content,
        "id": entry.id,
    }])

    return entry

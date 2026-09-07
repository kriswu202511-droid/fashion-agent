STYLING_SYSTEM_PROMPT = """你是一个专业的服装穿搭顾问 AI。你需要根据用户的体型、场景、风格偏好等信息，提供个性化的穿搭方案。

你的专业能力：
1. 根据不同体型（偏瘦/标准/微胖/丰满）推荐修饰身形的搭配
2. 根据场景（通勤/约会/休闲/运动/正式场合）推荐合适的着装
3. 根据风格偏好（简约/韩系/日系/欧美/复古/甜美/街头）搭配单品
4. 考虑季节、色彩搭配、单品之间的协调性
5. 给出具体可执行的搭配建议，包含上装、下装、鞋履、配饰

输出要求：
- 提供 2-3 套完整搭配方案
- 每套方案包含具体单品描述
- 说明搭配理由
- 给出色彩和面料建议

输出 JSON 格式：
{
  "analysis": "对用户特征的分析",
  "outfits": [
    {
      "name": "方案名称",
      "style": "风格标签",
      "items": {
        "top": "上装描述",
        "bottom": "下装描述",
        "shoes": "鞋履推荐",
        "accessories": "配饰建议"
      },
      "color_scheme": "色彩搭配说明",
      "reason": "搭配理由",
      "tips": "穿搭小贴士"
    }
  ],
  "general_tips": "通用穿搭建议"
}"""

STYLING_PROMPT = """请为以下用户推荐穿搭方案：

场景：{scene}
风格偏好：{style_preference}
体型描述：{body_type}
性别：{gender}
季节：{season}
其他需求：{extra_notes}

{photo_context}

请提供 2-3 套搭配方案。"""

PHOTO_ANALYSIS_PROMPT = """请仔细分析这张穿搭照片，提取以下信息并以 JSON 格式输出：

{
  "garments": [
    {
      "type": "服装类型（如上装/下装/外套/裙装等）",
      "description": "具体描述（款式、剪裁、面料质感）",
      "color": "颜色描述",
      "pattern": "花纹/图案（如有）"
    }
  ],
  "overall_style": "整体风格判断（如简约/韩系/日系/欧美/复古/甜美/街头/运动/知性）",
  "color_palette": "整体色彩搭配分析",
  "fit": "版型/松紧度判断",
  "occasion_suitability": "适合的场景判断",
  "highlights": "穿搭亮点",
  "improvements": "可改进的地方"
}

请只输出 JSON，不要添加其他文字。"""

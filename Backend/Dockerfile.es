FROM docker.elastic.co/elasticsearch/elasticsearch:7.17.9
# IK 中文分词器（EsProduct 的 name/subTitle/keywords/description 用 ik_max_word，
# 缺了它索引创建会直接失败）。GitHub Release 已不再发包，从 infinilabs 镜像站取。
RUN elasticsearch-plugin install --batch \
    https://release.infinilabs.com/analysis-ik/stable/elasticsearch-analysis-ik-7.17.9.zip

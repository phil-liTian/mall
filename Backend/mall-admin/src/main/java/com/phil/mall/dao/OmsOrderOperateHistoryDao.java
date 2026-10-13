package com.phil.mall.dao;

import com.phil.mall.model.OmsOrderOperateHistory;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 订单操作记录自定义Dao
 */
public interface OmsOrderOperateHistoryDao {
    /**
     * 批量创建
     */
    int insertList(@Param("list") List<OmsOrderOperateHistory> orderOperateHistoryList);
}

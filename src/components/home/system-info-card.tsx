import { useTranslation } from "react-i18next";
import { Typography, Stack, Divider, Chip, IconButton } from "@mui/material";
import { InfoOutlined, SettingsOutlined } from "@mui/icons-material";
import { useVerge } from "@/hooks/use-verge";
import { EnhancedCard } from "./enhanced-card";
import useSWR from "swr";
import { getRunningMode, getSystemInfo, installService } from "@/services/cmds";
import { useNavigate } from "react-router-dom";
import { version as appVersion } from "@root/package.json";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLockFn } from "ahooks";
import { Notice } from "@/components/base";

export const SystemInfoCard = () => {
  const { t } = useTranslation();
  const { verge, patchVerge } = useVerge();
  const navigate = useNavigate();

  // 系统信息状态
  const [osInfo, setOsInfo] = useState("");

  // 获取运行模式
  const { data: runningMode = "sidecar", mutate: mutateRunningMode } = useSWR(
    "getRunningMode",
    getRunningMode,
    { suspense: false, revalidateOnFocus: false },
  );

  // 是否以sidecar模式运行
  const isSidecarMode = runningMode === "sidecar";

  // 初始化系统信息
  useEffect(() => {
    // 获取系统信息
    getSystemInfo()
      .then((info) => {
        const lines = info.split("\n");
        if (lines.length > 0) {
          const sysName = lines[0].split(": ")[1] || "";
          const sysVersion = lines[1].split(": ")[1] || "";
          setOsInfo(`${sysName} ${sysVersion}`);
        }
      })
      .catch(console.error);
  }, []);

  // 导航到设置页面
  const goToSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  // 切换自启动状态
  const toggleAutoLaunch = useCallback(async () => {
    if (!verge) return;
    try {
      await patchVerge({ enable_auto_launch: !verge.enable_auto_launch });
    } catch (err) {
      console.error("切换开机自启动状态失败:", err);
    }
  }, [verge, patchVerge]);

  // 安装系统服务
  const onInstallService = useLockFn(async () => {
    try {
      Notice.info(t("Installing Service..."), 1000);
      await installService();
      Notice.success(t("Service Installed Successfully"), 2000);
      await mutateRunningMode();
    } catch (err: any) {
      Notice.error(err.message || err.toString(), 3000);
    }
  });

  // 点击运行模式处理
  const handleRunningModeClick = useCallback(() => {
    if (isSidecarMode) {
      onInstallService();
    }
  }, [isSidecarMode, onInstallService]);

  // 是否启用自启动
  const autoLaunchEnabled = useMemo(
    () => verge?.enable_auto_launch || false,
    [verge],
  );

  // 运行模式样式
  const runningModeStyle = useMemo(
    () => ({
      cursor: isSidecarMode ? "pointer" : "default",
      textDecoration: isSidecarMode ? "underline" : "none",
      "&:hover": {
        opacity: isSidecarMode ? 0.7 : 1,
      },
    }),
    [isSidecarMode],
  );

  // 只有当verge存在时才渲染内容
  if (!verge) return null;

  return (
    <EnhancedCard
      title={t("System Info")}
      icon={<InfoOutlined />}
      iconColor="error"
      action={
        <IconButton size="small" onClick={goToSettings} title={t("Settings")}>
          <SettingsOutlined fontSize="small" />
        </IconButton>
      }
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {t("OS Info")}
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {osInfo}
          </Typography>
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {t("Auto Launch")}
          </Typography>
          <Chip
            size="small"
            label={autoLaunchEnabled ? t("Enabled") : t("Disabled")}
            color={autoLaunchEnabled ? "success" : "default"}
            variant={autoLaunchEnabled ? "filled" : "outlined"}
            onClick={toggleAutoLaunch}
            sx={{ cursor: "pointer" }}
          />
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {t("Running Mode")}
          </Typography>
          <Typography
            variant="body2"
            fontWeight="medium"
            onClick={handleRunningModeClick}
            sx={runningModeStyle}
          >
            {isSidecarMode ? t("Sidecar Mode") : t("Service Mode")}
          </Typography>
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {t("Verge Version")}
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            v{appVersion}
          </Typography>
        </Stack>
      </Stack>
    </EnhancedCard>
  );
};

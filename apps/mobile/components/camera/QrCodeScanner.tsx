import { CameraView } from "expo-camera";
import { useCallback, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export type QrCodeScannerProps = {
  onBarcodeScanned: (data: string) => void;
  /** When false, barcode events are not forwarded (reduces duplicate reads while processing). */
  scanningEnabled?: boolean;
  facing?: "front" | "back";
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function QrCodeScanner({
  onBarcodeScanned,
  scanningEnabled = true,
  facing = "back",
  children,
  style,
}: QrCodeScannerProps) {
  const handleBarcode = useCallback(
    (event: { data: string }) => {
      if (scanningEnabled) onBarcodeScanned(event.data);
    },
    [onBarcodeScanned, scanningEnabled],
  );

  return (
    <View style={[styles.root, style]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanningEnabled ? handleBarcode : undefined}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

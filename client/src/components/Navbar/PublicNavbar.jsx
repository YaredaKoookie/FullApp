import {
    Box,
    Flex,
    HStack,
    IconButton,
    useDisclosure,
    Stack,
    Drawer,
    DrawerBody,
    // DrawerOverlay,
    DrawerContent,
    // DrawerCloseButton,
    Button,
    Text,
  } from "@chakra-ui/react";
  import { Menu, X } from "lucide-react"; // Lucide icons
  import { Link } from "react-router-dom"; // or 'next/link' for Next.js
  
  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Appointments", path: "/appointments" },
    { label: "Doctors", path: "/doctors" },
    { label: "Contact", path: "/contact" },
  ];
  
  export default function PublicNavbar() {
    const { isOpen, onOpen, onClose } = useDisclosure();
  
    return (
      <Box bg="white" px={4} shadow="md" position="sticky" top="0" zIndex="1000">
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Text fontWeight="bold" fontSize="xl">MyClinic</Text>
  
          <IconButton
            size="md"
            icon={isOpen ? <X size={20} /> : <Menu size={20} />}
            aria-label="Toggle menu"
            display={{ md: "none" }}
            onClick={isOpen ? onClose : onOpen}
            variant="ghost"
          />
  
          <HStack spacing={8} alignItems={"center"} display={{ base: "none", md: "flex" }}>
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                as={Link}
                to={link.path}
                fontWeight="medium"
              >
                {link.label}
              </Button>
            ))}
          </HStack>
        </Flex>
  
        {/* Mobile Drawer */}
        <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
          {/* <DrawerOverlay /> */}
          <DrawerContent>
            <Drawer.CloseTrigger  />
            <DrawerBody>
              <Stack spacing={4} mt={10}>
                {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    variant="ghost"
                    as={Link}
                    to={link.path}
                    onClick={onClose}
                    fontWeight="medium"
                    width="100%"
                    justifyContent="flex-start"
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    );
  }
  